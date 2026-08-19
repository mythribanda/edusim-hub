import { can, meetsMinTier, Action } from './src/index';
import { UserRole, AgeTier } from '@edusim/shared-types';
import * as assert from 'assert';

console.log("Running RBAC Unit Tests...");

const roles: UserRole[] = ['superadmin', 'admin', 'teacher', 'student', 'parent'];
const actions: Action[] = [
  'simulation:play',
  'formula:use',
  'tutor:chat',
  'homework:submit',
  'homework:create',
  'homework:grade',
  'student:monitor',
  'attendance:mark',
  'attendance:view',
  'institution:manage'
];

// Verify permissions matching matrix exactly
const expected: Record<UserRole, Record<Action, boolean>> = {
  superadmin: {
    'simulation:play': true,
    'formula:use': true,
    'tutor:chat': true,
    'homework:submit': true,
    'homework:create': true,
    'homework:grade': true,
    'student:monitor': true,
    'attendance:mark': true,
    'attendance:view': true,
    'institution:manage': true,
  },
  admin: {
    'simulation:play': true,
    'formula:use': true,
    'tutor:chat': true,
    'homework:submit': false,
    'homework:create': true,
    'homework:grade': true,
    'student:monitor': true,
    'attendance:mark': false,
    'attendance:view': true,
    'institution:manage': true,
  },
  teacher: {
    'simulation:play': true,
    'formula:use': true,
    'tutor:chat': true,
    'homework:submit': false,
    'homework:create': true,
    'homework:grade': true,
    'student:monitor': true,
    'attendance:mark': true,
    'attendance:view': true,
    'institution:manage': false,
  },
  student: {
    'simulation:play': true,
    'formula:use': true,
    'tutor:chat': true,
    'homework:submit': true,
    'homework:create': false,
    'homework:grade': false,
    'student:monitor': false,
    'attendance:mark': false,
    'attendance:view': true,
    'institution:manage': false,
  },
  parent: {
    'simulation:play': false,
    'formula:use': false,
    'tutor:chat': false,
    'homework:submit': false,
    'homework:create': false,
    'homework:grade': false,
    'student:monitor': true,
    'attendance:mark': false,
    'attendance:view': true,
    'institution:manage': false,
  }
};

let passed = 0;
let failed = 0;

for (const role of roles) {
  for (const action of actions) {
    const res = can(role, action);
    const exp = expected[role][action];
    try {
      assert.strictEqual(res, exp, `Role "${role}" on action "${action}" expected ${exp}, got ${res}`);
      passed++;
    } catch (err: any) {
      console.error(`FAIL: ${err.message}`);
      failed++;
    }
  }
}

// Test meetsMinTier helper
const tierTests: { user: AgeTier; min: AgeTier; expected: boolean }[] = [
  { user: 'primary', min: 'primary', expected: true },
  { user: 'primary', min: 'middle', expected: false },
  { user: 'middle', min: 'primary', expected: true },
  { user: 'middle', min: 'high_school', expected: false },
  { user: 'high_school', min: 'middle', expected: true },
  { user: 'university', min: 'high_school', expected: true },
  { user: 'high_school', min: 'university', expected: false },
];

for (const t of tierTests) {
  const res = meetsMinTier(t.user, t.min);
  try {
    assert.strictEqual(res, t.expected, `meetsMinTier("${t.user}", "${t.min}") expected ${t.expected}, got ${res}`);
    passed++;
  } catch (err: any) {
    console.error(`FAIL: ${err.message}`);
    failed++;
  }
}

console.log(`\nRBAC Tests Completed: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log("ALL RBAC TESTS PASSED SUCCESSFULLY!");
}
