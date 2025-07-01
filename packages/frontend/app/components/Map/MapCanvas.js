'use client'

import {Map} from 'react-map-gl/mapbox';

const MapCanvas = ({accessToken}) => {
    return(
        <Map 
            reuseMaps
            mapboxAccessToken={accessToken}
            initialViewState={{
                longitude: -105.8,
                latitude: 39.5,
                zoom: 6
            }}
        style={{ width: '100%', height: '100%' }}

        mapStyle="mapbox://styles/mapbox/streets-v11"
        />
        )
}

export default MapCanvas