import { gql } from '@apollo/client';

const MEDIA_ITEM_FIELDS = gql`
  fragment MediaItemFields on MediaItem {
    id
    order
    type
    source
    alt
    caption
  }
`;

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

export const GET_SITE_SETTINGS = gql`
  query GetSiteSettings {
    siteSettings {
      organizationName
      landingTitle
      landingSubtitle
      landingCtaText
      donateUrl
      donateLabel
      contactUrl
      contactLabel
    }
  }
`;

export const GET_STORY_BY_ID = gql`
  query GetStoryById($id: String!) {
    story(id: $id) {
      id
      title
      impactIcon
      steps {
        id
        order
        title
        content
        link
        mediaItems {
          ...MediaItemFields
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
              ...MediaItemFields
            }
            color
            renderType
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
                mediaItems {
                  ...MediaItemFields
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
          ...MediaItemFields
        }
        link
      }
    }
  }
  ${MEDIA_ITEM_FIELDS}
`;
