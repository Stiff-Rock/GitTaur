#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { readline } from 'readline'

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

// Function to update package.json
function updatePackageJson(version) {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const oldVersion = packageJson.version;
      packageJson.version = version;
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
      console.log(`Updated package.json version: ${oldVersion} → ${version}`);
      return true;
    } catch (error) {
      console.error('Error updating package.json:', error.message);
      return false;
    }
  } else {
    console.log('package.json not found');
    return false;
  }
}

// Function to update Cargo.toml
function updateCargoToml(version) {
  const cargoTomlPath = path.join(process.cwd(), 'Cargo.toml');
  if (fs.existsSync(cargoTomlPath)) {
    try {
      let cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
      // This regex matches the version field in the [package] section
      const versionRegex = /(\[package\][^\[]*version\s*=\s*)["']([^"']*)["']/s;
      if (versionRegex.test(cargoToml)) {
        const oldVersion = cargoToml.match(versionRegex)[2];
        cargoToml = cargoToml.replace(versionRegex, `$1"${version}"`);
        fs.writeFileSync(cargoTomlPath, cargoToml);
        console.log(`Updated Cargo.toml version: ${oldVersion} → ${version}`);
        return true;
      } else {
        console.log('Version field not found in Cargo.toml');
        return false;
      }
    } catch (error) {
      console.error('Error updating Cargo.toml:', error.message);
      return false;
    }
  } else {
    console.log('Cargo.toml not found');
    return false;
  }
}

// Function to git tag and push
function gitTagAndPush(version) {
  try {
    // Check if there are changes to commit
    const status = execSync('git status --porcelain').toString();
    if (status.trim()) {
      // Add the changes to git
      execSync('git add package.json Cargo.toml', { stdio: 'inherit' });

      // Commit the changes
      execSync(`git commit -m "Bump version to ${version}"`, { stdio: 'inherit' });
    } else {
      console.log('No changes to commit');
    }

    // Create a tag
    execSync(`git tag v${version}`, { stdio: 'inherit' });

    // Push the changes and the tag
    execSync('git push origin HEAD', { stdio: 'inherit' });
    execSync(`git push origin v${version}`, { stdio: 'inherit' });

    console.log(`Successfully tagged and pushed v${version}`);
    return true;
  } catch (error) {
    console.error('Error in git operations:', error.message);
    return false;
  }
}

// Function to get current versions
function getCurrentVersions() {
  const versions = {};

  // Get package.json version
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      versions.package = packageJson.version;
    } catch (error) {
      console.error('Error reading package.json:', error.message);
    }
  }

  // Get Cargo.toml version
  const cargoTomlPath = path.join(process.cwd(), 'Cargo.toml');
  if (fs.existsSync(cargoTomlPath)) {
    try {
      const cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
      const versionMatch = cargoToml.match(/\[package\][^\[]*version\s*=\s*["']([^"']*)["']/s);
      if (versionMatch) {
        versions.cargo = versionMatch[1];
      }
    } catch (error) {
      console.error('Error reading Cargo.toml:', error.message);
    }
  }

  return versions;
}

// Validate semver version
function isValidVersion(version) {
  // This regex matches semantic versions like 1.2.3 or 1.2.3-alpha.1
  return /^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version);
}

// Main function
async function main() {
  try {
    const currentVersions = getCurrentVersions();
    console.log('Current versions:');
    if (currentVersions.package) {
      console.log(`- package.json: ${currentVersions.package}`);
    }
    if (currentVersions.cargo) {
      console.log(`- Cargo.toml: ${currentVersions.cargo}`);
    }

    const defaultVersion = currentVersions.package || currentVersions.cargo || '0.1.0';

    let version = await question(`Enter the new version (current: ${defaultVersion}): `);
    if (!version) {
      version = defaultVersion;
    }

    // Validate version format
    if (!isValidVersion(version)) {
      console.error('Invalid version format. Please use semantic versioning (e.g., 1.2.3 or 1.2.3-alpha.1)');
      rl.close();
      return;
    }

    // Update files
    const packageUpdated = updatePackageJson(version);
    const cargoUpdated = updateCargoToml(version);

    if (packageUpdated || cargoUpdated) {
      // Confirm git operations
      const confirmGit = await question(`Do you want to commit, tag (v${version}), and push these changes? (y/n) `);
      if (confirmGit.toLowerCase() === 'y') {
        gitTagAndPush(version);
      } else {
        console.log('Git operations skipped');
      }
    } else {
      console.log('No files were updated');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    rl.close();
  }
}

// Run the main function
main();
