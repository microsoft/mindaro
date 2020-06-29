// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import React, { Component } from 'react'

export default class ErrorPanel extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div>
                {this.props.errorMessage != null &&
                    <div className={"errorPanel"}>
                        <div className={"errorPanelIcon"}></div>
                        <div className={"errorPanelMessage"} tabIndex="0">{this.props.errorMessage}</div>
                    </div>
                }
                <style jsx>{`
                    .errorPanel {
                        position: absolute;
                        bottom: 40px;
                        left: 10%;
                        right: 10%;
                        border-radius: 3px;
                        box-sizing: border-box;
                        background-color: #FFFCF9;
                        padding: 12px 15px;
                        box-shadow: 0px 2px 10px rgba(65, 65, 65 ,0.5);
                    }

                    .errorPanelIcon {
                        display: inline-block;
                        height: 50px;
                        width: 50px;
                        color: #E67938;
                        border: 3px solid #E67938;
                        border-radius: 25px;
                        font-size: 50px;
                        line-height: 46px;
                        text-align: center;
                    }

                    .errorPanelIcon:after {
                        content: "\\d7";
                    }

                    .errorPanelMessage {
                        position: absolute;
                        display: inline-block;
                        color: #4D6059;
                        font-size: 14px;
                        margin-left: 15px;
                        margin-right: 15px;
                        top: 13px;
                        bottom: 10px;
                        overflow-y: auto;
                    }
                `}</style>
            </div>
        )
    }
}