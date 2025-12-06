/**
 * 批量替換 getSession 為 getUser
 * 修復 Supabase 安全警告
 */

const fs = require('fs');
const path = require('path');

const files = [
    'app/api/conversations/route.ts',
    'app/api/conversations/end/route.ts',
    'app/api/favorites/route.ts',
    'app/api/timeline/route.ts',
];

const oldPattern = /const \{ data: \{ session \} \} = await supabase\.auth\.getSession\(\);[\r\n\s]+if \(!session\) \{[\r\n\s]+return unauthorized\(\);[\r\n\s]+\}[\r\n\s]+const userId = session\.user\.id;/g;

const newCode = `const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return unauthorized();
        }

        const userId = user.id;`;

files.forEach(file => {
    const filePath = path.join(process.cwd(), file);

    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;

        content = content.replace(oldPattern, newCode);

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ 已修復: ${file}`);
        } else {
            console.log(`⚠️  未找到匹配: ${file}`);
        }
    } else {
        console.log(`❌ 文件不存在: ${file}`);
    }
});

console.log('\n✅ 批量替換完成!');
