import { Context } from "./services/context";
import { DynamicPoint, DynamicPolygon, StoryStep } from '@prisma/client';
import { GraphQLScalarType, Kind, ValueNode } from 'graphql';

// Pass-through scalar backing `scalar JSON` in schema.graphql. Polygon
// coordinates are nested arrays whose depth varies by geometry type
// (Polygon = 3 levels, MultiPolygon = 4), so they can't be described by a
// fixed-depth GraphQL list. We hand the value straight through; Mapbox
// consumes the GeoJSON verbatim.
//
// parseLiteral/parseValue exist for completeness — nothing in this schema
// accepts JSON as input today (there are no mutations), so only serialize
// is exercised at runtime.
function parseLiteral(ast: ValueNode): unknown {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
    case Kind.FLOAT:
      return parseFloat(ast.value);
    case Kind.OBJECT:
      return Object.fromEntries(ast.fields.map(f => [f.name.value, parseLiteral(f.value)]));
    case Kind.LIST:
      return ast.values.map(parseLiteral);
    case Kind.NULL:
      return null;
    default:
      return null;
  }
}

const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'Arbitrary JSON value, passed through without transformation.',
  serialize: (value) => value,
  parseValue: (value) => value,
  parseLiteral,
});

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
      link: dbPoint.link,
      mediaItems: dbPoint.mediaItems,
    },
  };
}

export const resolvers = {

    JSON: JSONScalar,

    Query: {
        stories: async (_parent: any, _args: any, context: Context) => {
            return context.prisma.story.findMany({
                orderBy: { title: 'asc' },
            });
        },
        icons: async (_parent: any, _args: any, context: Context) => {
            return context.prisma.icon.findMany({
                orderBy: { name: 'asc' },
            });
        },
        siteSettings: async (_parent: any, _args: any, context: Context) => {
            // Singleton row (id = 1). upsert returns defaults on a fresh DB
            // so a missing seed never breaks the frontend.
            return context.prisma.siteSettings.upsert({
                where: { id: 1 },
                update: {},
                create: { id: 1 },
            });
        },
        story: async (_parent: any, { id }: { id: string }, context: Context) => {
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
                                orderBy: { order: 'asc' },
                                include: {
                                    mediaItems: { orderBy: { order: 'asc' } },
                                },
                            },
                            dynamicPolygons: {
                                orderBy: { order: 'asc' },
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