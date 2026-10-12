const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, '..', 'src', 'components');
const files = fs.readdirSync(componentsDir).filter((f) => f.endsWith('.jsx'));

let errors = [];

// 1. Check PageHeaderBanner.jsx
const headerBannerFile = path.join(componentsDir, 'PageHeaderBanner.jsx');
if (!fs.existsSync(headerBannerFile)) {
  errors.push('CRITICAL: PageHeaderBanner.jsx is missing!');
} else {
  const content = fs.readFileSync(headerBannerFile, 'utf8');
  if (content.includes('<button') || content.includes('onClick=')) {
    errors.push('VIOLATION: PageHeaderBanner.jsx MUST NOT contain any <button> or onClick handler!');
  }
}

// 2. Check all view components for ad-hoc banners containing buttons
files.forEach((f) => {
  const filePath = path.join(componentsDir, f);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    // Check if there is an ad-hoc top banner with gradient and rounded-3xl
    if (l.includes('bg-gradient-to-r') && l.includes('rounded-3xl') && l.includes('from-amber-500/10')) {
      // Check next 40 lines of this banner
      let bannerLines = [];
      let divBalance = 0;
      for (let j = i; j < Math.min(i + 50, lines.length); j++) {
        bannerLines.push(lines[j]);
        divBalance += (lines[j].match(/<div/g) || []).length;
        divBalance -= (lines[j].match(/<\/div>/g) || []).length;
        if (divBalance === 0 && j > i) break;
      }
      const bannerText = bannerLines.join('\n');
      if (bannerText.includes('<button') || bannerText.includes('OfficialDocActionToolbar')) {
        errors.push(`VIOLATION in ${f} (line ${i + 1}): Top header banner contains an action button or toolbar! All buttons must be relocated below the banner.`);
      }
    }
  }
});

if (errors.length > 0) {
  console.error('\n❌ BUILD GUARDRAILS FAILED:');
  errors.forEach((err) => console.error('  - ' + err));
  console.error('\nPlease fix these violations according to GEMINI.md before building.\n');
  process.exit(1);
} else {
  console.log('✅ UI Guardrails Passed: Zero buttons in header banners across all components.');
  process.exit(0);
}
