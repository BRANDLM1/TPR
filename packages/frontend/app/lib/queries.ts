import { gql } from '@apollo/client';

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
            mediaItems
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
                name
                description
                color
                markerImage
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
      dynamicStats{
        id
        order
        title
        statistic
        content
        mediaItems
        link
      }
    }
  }
`;
