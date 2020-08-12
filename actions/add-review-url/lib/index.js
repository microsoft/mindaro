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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
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
const AddReviewUrl_1 = __importDefault(require("./AddReviewUrl"));
const core = __importStar(require("@actions/core"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const addComment = new AddReviewUrl_1.default();
        try {
            const host = core.getInput('host');
            let headref = core.getInput('branch-name') || '';
            let protocol = core.getInput('protocol') || 'http';
            const comment = `You can see a private version of the changes made in this pull request here:\n${protocol}://${headref}.${host}/`;
            yield addComment.addComment(comment);
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run().catch(error => core.setFailed(error.message));
