declare class AddComment {
    getOwnerAndRepo(): string[];
    private addPullRequestCommentMutation;
    private getPullNumber;
    private findPullRequestQuery;
    private addCommentUsingSubjectId;
    private getSubjectId;
    addComment(comment: string): Promise<{
        [key: string]: any;
    } | null | undefined>;
}
export default AddComment;
