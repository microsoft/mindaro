// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const Footer = (props) => (
    <div className="footer-container">
        <div className="footer-content">
            {props.children}
        </div>
        <style jsx global>{`
            .footer-content {
                bottom: 10px;
                text-align:center;
                margin-top: 60px;
            }

            .footer-container {
                background-color: #fff;
                position: fixed;
                bottom: 0px;
                width: 100%;
                height: 140px;
                -webkit-mask-image: linear-gradient(
                    to bottom,
                    rgba(255, 255, 255, 0) 0%,
                    rgba(255, 255, 255, 0) 10%,
                    rgba(255, 255, 255, 1) 45%,
                    rgba(255, 255, 255, 1) 100%
                );
            }
        `}</style>
    </div>
)

export default Footer