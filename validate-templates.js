// Simple template validation script
const fs = require('fs');
const path = require('path');

const templateDir = './templates';

function validateTemplate(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // Check for common Handlebars issues
    const openBraces = (content.match(/{{/g) || []).length;
    const closeBraces = (content.match(/}}/g) || []).length;
    
    if (openBraces !== closeBraces) {
        issues.push(`Mismatched braces: ${openBraces} open, ${closeBraces} close`);
    }
    
    // Check for unclosed tags
    const openTags = content.match(/<[^>\/]+>/g) || [];
    const closeTags = content.match(/<\/[^>]+>/g) || [];
    
    const tagCounts = {};
    openTags.forEach(tag => {
        const tagName = tag.match(/<(\w+)/)?.[1];
        if (tagName && !['input', 'img', 'br', 'hr', 'meta', 'link'].includes(tagName)) {
            tagCounts[tagName] = (tagCounts[tagName] || 0) + 1;
        }
    });
    
    closeTags.forEach(tag => {
        const tagName = tag.match(/<\/(\w+)/)?.[1];
        if (tagName) {
            tagCounts[tagName] = (tagCounts[tagName] || 0) - 1;
        }
    });
    
    Object.entries(tagCounts).forEach(([tag, count]) => {
        if (count !== 0) {
            issues.push(`Unclosed ${tag} tags: ${count > 0 ? count + ' unclosed' : Math.abs(count) + ' extra closing'}`);
        }
    });
    
    return issues;
}

function validateAllTemplates(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
            validateAllTemplates(fullPath);
        } else if (file.name.endsWith('.hbs')) {
            console.log(`\nValidating: ${fullPath}`);
            const issues = validateTemplate(fullPath);
            
            if (issues.length === 0) {
                console.log('✓ No issues found');
            } else {
                console.log('✗ Issues found:');
                issues.forEach(issue => console.log(`  - ${issue}`));
            }
        }
    }
}

validateAllTemplates(templateDir);