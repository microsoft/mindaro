// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Component } from 'react'

export default class FormTextbox extends Component {

    constructor (props) {
        super(props);
    }

    render() {
        return (
            <div>
                <div className="form-group">
                    <input 
                        className="form-control" 
                        type={this.props.inputType} 
                        id={this.props.inputID} 
                        placeholder={this.props.placeholder}
                        value={this.props.value}
                        onChange={this.props.onChange}>
                    </input>
                </div>
                <style jsx>{`
                    input {
                        font-size: 14px;
                    }
                `}</style>
            </div>
        )
    }
}