const fs = require("fs");
const close = "</" + "motion>";
const closeDiv = close.replace("motion", "div");

const files = [
  "src/components/admin/notices/AdminNoticeTable.tsx",
  "src/components/student/StudentNoticeBoard.tsx",
  "src/app/admin/notices/page.tsx",
];

for (const p of files) {
  let s = fs.readFileSync(p, "utf8");
  s = s.replace(/\[\[OPEN\]\]/g, "<OPEN");
  s = s.replace(/\[\[CLOSE_OPEN\]\]/g, ">");
  s = s.replace(/\[\[CLOSE\]\]/g, "<CLOSE>");
  s = s.replace(/<OPEN/g, "<div");
  s = s.replace(/<CLOSE>/g, closeDiv);
  s = s.replace(new RegExp(close, "g"), closeDiv);
  fs.writeFileSync(p, s);
  console.log("fixed", p);
}
