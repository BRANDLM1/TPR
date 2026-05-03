import { Context } from "./services/context";
import { DynamicPoint, DynamicPolygon, StoryStep } from '@prisma/client';

function transformPointToGeoJson( dbPoint: (DynamicPoint & { mediaItems?: any[] }) | null
) {
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
      renderType: dbPoint.renderType,
      markerImage: dbPoint.markerImage,
      mediaItems: dbPoint.mediaItems,
    },
  };
}

export const resolvers = {

    Query: {
        story: async (_parent: any, { id }: { id: string }, context: Context) => {
            console.log(`Fetching story with ID: ${id}`);
            //Log Story ID for debug
            //Query for associated story data
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
                                            mediaItems: { orderBy: { order: 'asc' } },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            //Return story object or null
            return dbStory;
        },
    },
    StoryStep: {
        // Parent is Storystep obj with dynamicPoints array
        //Transform into geojson as workaround to Prismas geospatial query limitations
        dynamicPoints: (parent: StoryStep & { dynamicPoints: any[] }) => {
            if (!parent.dynamicPoints) return [];
            
            return parent.dynamicPoints.map(transformPointToGeoJson);
        },

        dynamicPolygons: (parent: StoryStep & { dynamicPolygons: (DynamicPolygon & { centerPoint?: any })[] }) => {
            if(!parent.dynamicPolygons) return [];
            
            return parent.dynamicPolygons.map(dbPolygon => ({
                type: 'Feature',
                geometry: dbPolygon.geometry as any,
                properties: {
                    id: dbPolygon.id, 
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