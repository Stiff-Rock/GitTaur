#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Configuration
const projectRoot = process.cwd();
const rustProjectPath = path.join(projectRoot, 'src-tauri');
const outputFile = path.join(projectRoot, 'CREDITS.md');
const tempFrontendFile = path.join(projectRoot, 'CREDITS-frontend.md');
const tempBackendFile = path.join(projectRoot, 'CREDITS-backend.md');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

console.log(`${colors.bright}${colors.cyan}=== Generating Project Dependencies Credits ===${colors.reset}`);

// Create template files
function createTemplates() {
  console.log(`${colors.yellow}Creating template files...${colors.reset}`);

  // Create Handlebars template for cargo-about
  const handlebarsTemplate = `{{#each licenses}}
{{#each used_by}}
[{{crate.name}}@{{crate.version}}]({{#if crate.repository}}{{crate.repository}}{{else}}https://crates.io/crates/{{crate.name}}{{/if}}) - {{../name}}
{{/each}}
{{/each}}`;

  fs.writeFileSync(path.join(projectRoot, 'about.hbs'), handlebarsTemplate);

  // Create about.toml configuration
  const aboutToml = `accepted = [
  "MIT",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause", 
  "MPL-2.0",
  "Unicode-3.0",
  "ISC",
  "CC0-1.0",
  "Apache-2.0 WITH LLVM-exception",
]`;

  fs.writeFileSync(path.join(projectRoot, 'about.toml'), aboutToml);
  console.log(`${colors.green}✓ Templates created${colors.reset}`);
}

// Generate frontend dependencies
function generateFrontendCredits() {
  console.log(`${colors.yellow}Generating frontend dependencies...${colors.reset}`);
  try {
    execSync(`npx license-checker --markdown > ${tempFrontendFile}`, { stdio: 'inherit' });
    console.log(`${colors.green}✓ Frontend dependencies generated${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Error generating frontend dependencies: ${error.message}${colors.reset}`);
    return false;
  }
}

// Generate backend dependencies
function generateBackendCredits() {
  console.log(`${colors.yellow}Generating backend dependencies...${colors.reset}`);
  try {
    // Navigate to rust project directory
    process.chdir(rustProjectPath);

    // Run cargo-about and redirect output
    execSync(`cargo about generate ${path.join(projectRoot, 'about.hbs')} > ${tempBackendFile}`, { stdio: 'inherit' });

    // Navigate back to project root
    process.chdir(projectRoot);

    console.log(`${colors.green}✓ Backend dependencies generated${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Error generating backend dependencies: ${error.message}${colors.reset}`);
    // Make sure to return to project root even if there's an error
    process.chdir(projectRoot);
    return false;
  }
}

// Combine both files
function combineCredits() {
  console.log(`${colors.yellow}Combining credits...${colors.reset}`);

  try {
    let content = '# Project Dependencies\n\n';

    // Add frontend dependencies if file exists
    if (fs.existsSync(tempFrontendFile)) {
      content += '## Frontend Dependencies\n\n';
      content += fs.readFileSync(tempFrontendFile, 'utf8');
      content += '\n\n';
    }

    // Add backend dependencies if file exists
    if (fs.existsSync(tempBackendFile)) {
      content += '## Backend Dependencies\n\n';
      content += fs.readFileSync(tempBackendFile, 'utf8');
    }

    // Write the combined content to CREDITS.md
    fs.writeFileSync(outputFile, content);

    console.log(`${colors.green}✓ Credits combined into ${outputFile}${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Error combining credits: ${error.message}${colors.reset}`);
    return false;
  }
}

// Clean up temporary files
function cleanup() {
  console.log(`${colors.yellow}Cleaning up temporary files...${colors.reset}`);

  const filesToRemove = [
    tempFrontendFile,
    tempBackendFile,
    path.join(projectRoot, 'about.hbs'),
    path.join(projectRoot, 'about.toml')
  ];

  filesToRemove.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });

  console.log(`${colors.green}✓ Cleanup complete${colors.reset}`);
}

// Main execution
(async function main() {
  try {
    createTemplates();

    const frontendSuccess = generateFrontendCredits();
    const backendSuccess = generateBackendCredits();

    if (frontendSuccess || backendSuccess) {
      combineCredits();
    } else {
      console.error(`${colors.red}✗ No credits were generated. Aborting.${colors.reset}`);
      process.exit(1);
    }

    cleanup();
    console.log(`${colors.bright}${colors.green}✓ All done! Credits file generated at ${outputFile}${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}✗ An unexpected error occurred: ${error.message}${colors.reset}`);
    process.exit(1);
  }
})();
