// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Component } from 'react'
import Page from "../components/Page"
import Content from "../components/Content"
import SigninFormLayout from '../components/SigninFormLayout'
import Logo from '../components/Logo'
import FormButton from '../components/FormButton'
import Router from 'next/router'
import helpers from '../lib/helpers';
import ErrorPanel from '../components/ErrorPanel'

export default class DevSignin extends Component {

    constructor(props) {
        super(props);
        this.state = {
            users: [],
            errorMessage: undefined
        };
    }

    async componentDidMount() {
        try {
            // Clears any login information the user may still have.
            helpers.clearUserCookie();
    
            // Retrieves all users that can be selected for sign-in.
            this.apiHost = await helpers.getApiHostAsync();
            const usersResponse = await fetch(`${this.apiHost}/api/user/allUsers`);
            let users = await usersResponse.json();
            console.log("Users retrieved", users);

            // Filtering out vendors, as we don't provide any vendors experience for now.
            users = users.filter(user => user.type != "vendor");

            if (users.length == 0) {
                this.setState({errorMessage: `No users have been retrieved from the database. Make sure that your PopulateDatabase job ran successfully.`});
                return;
            }

            this.setState({users: users});
        }
        catch (error) {
            console.error(error);
            this.setState({errorMessage: `Error while retrieving users to select. Make sure that your Gateway and Users services are up and running. Details: ${error.message}`});
            return;
        }
    }

    async handleClick(context) {
        const userId = arguments[0];
        const userName = arguments[1];
        console.log(`User selected: ${userName} - ${userId}`);
        helpers.storeUserCookie(userId);

        // Navigate to index.
        Router.push("/");
    }

    render() {
        return (
            <Page>
                <Content>
                    <SigninFormLayout>
                        <Logo />
                        <br /><br />
                        {this.state.users.length > 0 &&
                            <form>
                                <p className={"userSelectionHeader"} tabIndex="0">Select a test user:</p>
                                {this.state.users.map((user, index) => (
                                    <FormButton key={index} primary onClick={this.handleClick.bind(this, user.id, user.name)}>{user.name} ({user.type})</FormButton>
                                ))}
                            </form>
                        }
                    </SigninFormLayout>
                    <ErrorPanel errorMessage={this.state.errorMessage} />
                </Content>
                <style jsx>{`
                    form {
                        width: 85%;
                        margin-left: auto;
                        margin-right: auto;
                    }

                    .userSelectionHeader {
                        margin-bottom: 10px;
                    }
                `}
                </style>
            </Page>
        );
    }
}
