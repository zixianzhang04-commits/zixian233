const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '..', 'dev-logs');
const date = new Date();
const yyyy = date.getFullYear();
const mm = String(date.getMonth() + 1).padStart(2, '0');
const dd = String(date.getDate()).padStart(2, '0');
const filename = `${yyyy}-${mm}-${dd}.md`;
const filePath = path.join(logsDir, filename);

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

if (fs.existsSync(filePath)) {
  console.log(`日志文件已存在: ${filePath}`);
  process.exit(0);
}

const content = `# ${yyyy}-${mm}-${dd} 开发日志\n\n## 完成事项\n- \n\n## 待办事项\n- \n\n## 问题与备注\n- \n`;
fs.writeFileSync(filePath, content, 'utf8');
console.log(`已生成日志文件: ${filePath}`);
