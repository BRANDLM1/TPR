import { gql } from '@apollo/client';

export const GET_STORIES = gql`
  query GetStories {
    stories {
      id
      title
    }
  }
`;

export const GET_ICONS = gql`
  query GetIcons {
    icons {
      name
      url
    }
  }
`;

export const GET_STORY_BY_ID = gql`
  query GetStoryById($id: String!) {
    story(id: $id) {
      id
      title
      steps {
        id
        order
        title
        content
        link
        mediaItems {
          id
          order
          type
          source
          alt
          caption
        }
        layersToShow
        layersToHide
        dynamicPoints {
          type
          geometry {
            type
            coordinates
          }
          properties {
            id
            name
            description
            mediaItems {
              id
              order
              type
              source
              alt
              caption
            }
            color
            markerImage
            link
          }
        }
        dynamicPolygons {
          type
          geometry {
            type
            coordinates
          }
          properties {
            id
            name
            fillColor
            fillOpacity
            lineColor
            lineWidth
            centerPoint {
              type
              geometry {
                type
                coordinates
              }
              properties {
                id
                name
                description
                color
                markerImage
                mediaItems{
                  id
                  order
                  type
                  source
                  alt
                  caption
                }
              }
            }
          }
        }
        nextButtonText
        modalPosition
        zoom
        latitude
        longitude
        pitch
        bearing
      }
      impactStats {
        id
        order
        title
        statistic
        content
        mediaItems {
          id
          order
          type
          source
          alt
          caption
        }
        link
      }
    }
  }
`;
