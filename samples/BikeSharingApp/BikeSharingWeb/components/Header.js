// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import Link from 'next/link'

const Header = (props) => (
    <div className="row">
        <div className="col"></div>
        <div className="col logo">
            <Link href="/">
                <img src="/static/awc-title.svg" alt="Adventure Works Cycles" />
            </Link>
        </div>
        <div className="col userMenu">
        {props.userName != null &&
            <span className="userSignOut">
                <Link href="/devsignin"><span tabIndex="0">Hi {props.userName} | Sign out</span></Link>
            </span>
        }
        </div>
        <style jsx>{`
            .row {
                background-color: #fff;
                min-height: 48px;
                box-shadow:0px 2px 10px rgba(65, 65, 65, 0.25);
            }

            div {
                padding: 0;
                margin: 0;
            }
            
            .userMenu {
                padding-top: 13px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                text-align: right;
            }

            .userSignOut {
                margin-right: 14px;
                margin-left: 10px;
                cursor: pointer;
                color: #000000;
                letter-spacing: 0.05em;
                font-size: 16px;
            }

            .userSignOut:hover {
                text-decoration: underline;
            }

            .logo {
                padding-top: 12px;
                text-align: center;
            }
        `}</style>
    </div>
)

export default Header