// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Component } from 'react'

export default class FormButton extends Component {

    constructor (props) {
        super(props);
    }

    render() {
        return (
            <div>
                <button type="button" className={"btn " + (this.props.primary ? 'primary' : '')} onClick={() => this.props.onClick()}>{this.props.children}</button>
                <style jsx>{`
                    .btn {
                        background-color: #688379;
                        border-color: #688379;
                        width: 100%;
                        border-radius: 100px;
                        color: #fff;
                        margin-bottom: 10px;
                        font-size: 14px;
                        max-width: 250px;
                    }

                    .btn:hover {
                        background-color: #536B62;
                        border-color: #536B62;
                    }

                    .primary {
                        background-color: #E67938;
                        border-color: #E67938;
                    }

                    .primary:hover {
                        background-color: #C56D39;
                        border-color: #C56D39;
                    }
                `}</style>
            </div>
        )
    }
}