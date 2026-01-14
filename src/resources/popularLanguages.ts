import { languages } from "./languages";

const list = [
  "Python",
  "Java",
  "JavaScript",
  "C",
  "C++",
  "C#",
  "PHP",
  "R",
  "Objective-C",
  "TypeScript",
  "Swift",
  "Kotlin",
  "Matlab",
  "Go",
  "Rust",
  "HTML",
  "CSS",
  "VBA",
  "Ruby",
  "Assembly",
  "SQL",
  "Fortran",
  "Visual Basic .NET",
  "Dart",
  "Lua",
  "Cobol",
  "Groovy",
  "Perl",
  "Julia",
  "Haskell",
  "Pascal",
];
const langSet = new Set(list);

export const popularLanguages = languages
.filter((lang) =>
  langSet.has(lang[0])
)
.sort((a, b) => {
  return list.indexOf(a[0]) - list.indexOf(b[0]);
});
