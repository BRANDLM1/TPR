import { gql } from '@apollo/client';

export const GET_STORY_BY_ID = gql`
  query GetStoryById($id: String!) {
    story(id: $id) {
      id
      title
      steps {
        id
        title
        content
        link
        mediaType
        mediaSrc
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
          }
        }
        nextButtonText
      }
      stats{
        id
        title
        statistic
        content
        link
      }
    }
  }
`;
