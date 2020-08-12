// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import addReviewUrl from '../src/AddReviewUrl';
beforeEach(() => {
    if(!process.env.GITHUB_REPOSITORY) 
    {
        process.env.GITHUB_REPOSITORY = 'someactionowner/reponame';
    }
});
test('Add-review-url tests', () =>  {
    const  addComment = new addReviewUrl();
    var a:string[] = addComment.getOwnerAndRepo();        
    expect(a[0]).toBe('someactionowner');
    expect(a[1]).toBe('reponame');
});
