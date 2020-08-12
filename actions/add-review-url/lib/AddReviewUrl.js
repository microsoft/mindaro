"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const core = __importStar(require("@actions/core"));
const graphql_1 = require("@octokit/graphql");
class AddComment {
    getOwnerAndRepo() {
        core.debug(`process.env.GITHUB_REPOSITORY ${process.env.GITHUB_REPOSITORY}`);
        if (process.env.GITHUB_REPOSITORY) {
            return process.env.GITHUB_REPOSITORY.split('/');
        }
        else {
            core.debug('Error in getOwnerAndRepo');
            throw new Error('not able to obtain GITHUB_REPOSITORY from process.env');
        }
    }
    addPullRequestCommentMutation() {
        return `mutation AddPullRequestComment($subjectId: ID!, $body: String!) {
                addComment(input:{subjectId:$subjectId, body: $body}) {
                    commentEdge {
                        node {
                            createdAt
                            body
                        }
                    }
                    subject {
                        id
                    }
                }
            }`;
    }
    getPullNumber() {
        if (process.env.GITHUB_REF) {
            return parseInt(process.env.GITHUB_REF.split('/')[2]);
        }
        else {
            throw new Error('GITHUB_REF is missing in process.env');
        }
    }
    findPullRequestQuery() {
        return `query FindPullRequestID ($owner: String!, $repo: String!, $pullNumber: Int!){
                repository(owner:$owner, name:$repo) {
                    pullRequest(number:$pullNumber) {
                        id
                    }
                }
            }`;
    }
    addCommentUsingSubjectId(pullRequestId, comment) {
        return __awaiter(this, void 0, void 0, function* () {
            core.debug(`pullRequestId  ===>>>> ${pullRequestId}`);
            let data = JSON.parse(JSON.stringify(pullRequestId));
            core.debug(`Parsed pull request id ${data}`);
            const token = core.getInput('repo-token');
            let graphQlResponse = graphql_1.graphql(this.addPullRequestCommentMutation(), {
                headers: {
                    authorization: `token ${token}`,
                },
                subjectId: data.repository.pullRequest.id,
                body: comment,
            });
            core.debug(`Adding the comment ...`);
            return yield graphQlResponse;
        });
    }
    getSubjectId(findPullRequestIdQuery, nameAndRepo) {
        return __awaiter(this, void 0, void 0, function* () {
            core.debug('Inside getSubjectId');
            const token = core.getInput('repo-token');
            let newVar = yield graphql_1.graphql(findPullRequestIdQuery, {
                headers: {
                    authorization: `token ${token}`,
                },
                owner: nameAndRepo[0],
                repo: nameAndRepo[1],
                pullNumber: this.getPullNumber(),
            });
            core.debug(`Exiting getSubject Id`);
            return newVar;
        });
    }
    addComment(comment) {
        return __awaiter(this, void 0, void 0, function* () {
            core.debug('Inside addComment');
            const nameAndRepo = this.getOwnerAndRepo();
            const [name, repo] = nameAndRepo;
            core.debug(`Name is ${name}  and repo is ${repo}`);
            const findPullRequestIdQuery = this.findPullRequestQuery();
            try {
                const subjectId = yield this.getSubjectId(findPullRequestIdQuery, nameAndRepo);
                return yield this.addCommentUsingSubjectId(subjectId, comment);
            }
            catch (error) {
                core.setFailed(error.message);
            }
        });
    }
}
exports.default = AddComment;
