// not to be used

import { calculateKeywordMatch } from "./keywordMatcher";


const resumeText = `
I am a full stack developer with experience in
Next.js, React, TypeScript and MySQL.

I have also worked with Prisma and Node.js.
`;


const projectKeywords = [
    {
        keyword: "Next.js",
        weight: 10,
    },
    {
        keyword: "React",
        weight: 8,
    },
    {
        keyword: "TypeScript",
        weight: 9,
    },
    {
        keyword: "MySQL",
        weight: 7,
    },
    {
        keyword: "Python",
        weight: 6,
    },
    {
        keyword: "FastAPI",
        weight: 5,
    },
];


const result = calculateKeywordMatch(
    resumeText,
    projectKeywords
);


console.log(result);
