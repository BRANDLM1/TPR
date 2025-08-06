import { Context } from "./src/services/context";

export const resolvers = {

    Query: {
        story: async (_parent, {id }: {id: string}, context: Context,) => {
            console.log(`Fetching story with ID: ${ id }`);

            const dbStory = await context.prisma.story.findUnique({
                where: { id: id },
                include: {
                    steps: {
                        orderBy: { order: 'asc' },
                        include: {
                            mediaItems: { orderBy: { order: 'asc' } },
                                dynamicPoints: {
                                    include: {
                                        mediaItems: { orderBy: { order: 'asc' } }
                                    }
                            }
                        } 
                    }
                }
            });

            return dbStory;
        },
    },
    Story: {
        dynamicStats: async(parent, _args, context: Context) => {
            const storyId = parent.id
            console.log(`Fetching impact statistics for Story ID: ${storyId}`)

            const dbStats = await
            context.prisma.impactStat.findMany({
                where: { storyId: storyId },
                orderBy: { order: 'asc' },
                include: {
                    mediaItems: {
                        orderBy: { order: 'asc' }
                    }
                }
            });

            return dbStats;            
        },
    },

    StoryStep: {
        dynamicPoints: async(parent, _args, context: Context, _info) => {
            const storyStepId = parent.id;
            console.log(`Fetching dynamic points for StoryStep ID: ${storyStepId}`)
            
            const dbPoints = await
            context.prisma.dynamicPoint.findMany({
                where: { storyStepId: storyStepId },
                include:{
                    mediaItems: {
                    orderBy: { order: 'asc' }
                    }
                }
            });

            const geoJsonFeatures = dbPoints.map(point => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [point.longitude, point.latitude],
                },
                properties: {
                    name: point.name,
                    description: point.description,
                    color: point.color,
                    markerImage: point.markerImage,
                    mediaItem: point.mediaItems,
                },
            }));
            return geoJsonFeatures;
        }
    },
}