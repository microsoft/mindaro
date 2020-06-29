// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const SigninFormLayout = (props) => (
    <div className="center">
        {props.children}
        <style jsx>{`
            .center {
                text-align:center;
                margin: 0;
                position: absolute;
                top: 50%;
                left: 50%;
                -ms-transform: translate(-50%, -50%);
                transform: translate(-50%, -50%);
            }
        `}</style>
    </div>
)

export default SigninFormLayout