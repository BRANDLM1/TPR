import { Context } from "./src/services/context";


function transformPointToGeoJson(dbPoint) {
  if (!dbPoint) return null;
  
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [dbPoint.longitude, dbPoint.latitude],
    },
    properties: {
      id: dbPoint.id,
      name: dbPoint.name,
      description: dbPoint.description,
      color: dbPoint.color,
      markerImage: dbPoint.markerImage,
      mediaItems: dbPoint.mediaItems,
    },
  };
}

export const resolvers = {

    Query: {
        story: async (_parent, { id }: { id: string }, context: Context) => {
            console.log(`Fetching story with ID: ${id}`);

            const dbStory = await context.prisma.story.findUnique({
                where: { id: id },
                include: {
                    impactStats: {
                        orderBy: { order: 'asc' },
                        include: {
                            mediaItems: { orderBy: { order: 'asc' } },
                        },
                    },
                    steps: {
                        orderBy: { order: 'asc' },
                        include: {
                            mediaItems: { orderBy: { order: 'asc' } },
                            dynamicPoints: {
                                include: {
                                    mediaItems: { orderBy: { order: 'asc' } },
                                },
                            },
                            dynamicPolygons: {
                                include: {
                                    centerPoint: {
                                        include: {
                                            mediaItems: { orderBy: { order: 'asc' } }
                                        }
                                    }
                                }
                            }
                        },
                    },
                },
            });
            return dbStory;
        },
    },
    StoryStep: {
        // Parent is Storystep obj with dynamicPoints array
        //Transform into geojson as workaround to Prismas geospatial query limitations
        dynamicPoints: (parent) => {
            if (!parent.dynamicPoints) return [];
            
            return parent.dynamicPoints.map(transformPointToGeoJson);
        },

        dynamicPolygons: (parent) => {
            if(!parent.dynamicPolygons) return [];
            
            return parent.dynamicPolygons.map(dbPolygon => ({
                type: 'Feature',
                geometry: dbPolygon.geometry as any,
                properties: {
                    name: dbPolygon.name,
                    fillColor: dbPolygon.fillColor,
                    fillOpacity: dbPolygon.fillOpacity,
                    lineColor: dbPolygon.lineColor,
                    lineWidth: dbPolygon.lineWidth,
                    centerPoint: transformPointToGeoJson(dbPolygon.centerPoint),
                },
            }));
        },
    },
};