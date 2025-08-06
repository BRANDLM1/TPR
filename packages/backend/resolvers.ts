import { Context } from "./src/services/context";

export const resolvers = {

    Query: {
        story: async (_parent, {id }: {id: string}, context: Context,) => {
            console.log(`Fetching story with ID: ${ id }`);

            const dbStory = await
            context.prisma.story.findUnique({
                where: { id: id },
                include: {
                    steps: true,
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
                where: { storyId: storyId }
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
                where: { storyStepId: storyStepId }
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
                    mediaType: point.mediaType,
                    mediaSrc: point.mediaSrc,
                },
            }));
            return geoJsonFeatures;
        }
    },
}