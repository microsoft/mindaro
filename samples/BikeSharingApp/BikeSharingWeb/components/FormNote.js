// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const FormNote = (props) => (
    <div className="fine-label" tabIndex="0">{props.text}
    <style jsx>{`
        .fine-label {
            font-weight: 100;
            font-size: 10px;
            line-spacing: 1px;
            color: #4D6059;
        }
    `}</style>
    </div >
)

export default FormNote