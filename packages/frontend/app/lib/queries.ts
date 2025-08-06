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
            name
            description
            mediaItems
            color
            markerImage
            link
          }
        }
        nextButtonText
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
