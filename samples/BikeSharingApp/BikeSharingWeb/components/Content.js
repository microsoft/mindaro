// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const Content = (props) => (
    <div className="content-container">
        {props.children}
        <br /><br /><br /><br />
        <style jsx>{`
            .content-container {
                padding-top: 28px;
                padding-bottom: 10px;
                margin:auto;
                width: 90%;
            }
        `}</style>
    </div>
)

export default Content