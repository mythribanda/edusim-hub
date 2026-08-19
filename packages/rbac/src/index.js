"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.can = can;
exports.meetsMinTier = meetsMinTier;
var PERMISSIONS = {
    superadmin: new Set([
        'simulation:play',
        'formula:use',
        'tutor:chat',
        'homework:submit',
        'homework:create',
        'homework:grade',
        'student:monitor',
        'attendance:mark',
        'attendance:view',
        'institution:manage',
    ]),
    admin: new Set([
        'simulation:play',
        'formula:use',
        'tutor:chat',
        'homework:create',
        'homework:grade',
        'student:monitor',
        'attendance:view',
        'institution:manage',
    ]),
    teacher: new Set([
        'simulation:play',
        'formula:use',
        'tutor:chat',
        'homework:create',
        'homework:grade',
        'student:monitor',
        'attendance:mark',
        'attendance:view',
    ]),
    student: new Set([
        'simulation:play',
        'formula:use',
        'tutor:chat',
        'homework:submit',
        'attendance:view',
    ]),
    parent: new Set([
        'student:monitor',
        'attendance:view',
    ]),
};
function can(role, action) {
    var rolePermissions = PERMISSIONS[role];
    if (!rolePermissions)
        return false;
    return rolePermissions.has(action);
}
var TIER_RANKS = {
    primary: 1,
    middle: 2,
    high_school: 3,
    university: 4,
};
function meetsMinTier(userTier, minTier) {
    var userRank = TIER_RANKS[userTier];
    var minRank = TIER_RANKS[minTier];
    if (userRank === undefined || minRank === undefined)
        return false;
    return userRank >= minRank;
}
