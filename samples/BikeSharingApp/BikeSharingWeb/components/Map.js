// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const Map = (props) => (
    <div>
        <img src="/static/sample-map.png" alt="map of bike location" />
        <style jsx>{`
            div {
                padding-top: 15px;
            }
            img {
                border: 1px solid #C8C8C8;
                width: 100%;
                max-height:300px;
                object-fit: cover;
            }
        `}</style>
    </div >
)

export default Map