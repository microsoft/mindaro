// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const BikeCard = (props) => (
    <div className="outer">
        <div className="media" tabIndex="0">
            <img className="mr-3" src={props.imageUrl} alt="photo of bike" />
            <div className="media-body">
                <div className="mt-0 bike-name">{props.name}</div>
                <div>{props.address}</div>
                <div>${props.rate}/hour</div>
            </div>
        </div>
        <style jsx>{`
            .media {
                padding: 12px;
            }

            img {
                width: 65px;
            }

            .media-body>div.bike-name {
                font-size: 16px;
                font-weight: bold;
                line-height: 1.2;
                padding-bottom: 10px;
            }

            .media-body>div {
                font-size: 12px;
                line-height: 1.3;
            }

            .outer {
                margin-top: 12px;
                margin-right: 12px;
                box-shadow: 0px 2px 10px rgba(65, 65, 65, 0.25);
                cursor: pointer;
            }

            .outer:hover {
                box-shadow: 0px 2px 10px rgba(65, 65, 65, 0.55);
            }
        `}</style>
    </div>
)

export default BikeCard