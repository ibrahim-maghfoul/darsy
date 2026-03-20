"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = __importDefault(require("mongoose"));
var dotenv_1 = __importDefault(require("dotenv"));
var path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
// Simple schemas for the migration script
var UserSchema = new mongoose_1.default.Schema({
    progress: {
        totalLessons: { type: Number, default: 0 },
        completedLessons: { type: Number, default: 0 },
        lessons: { type: [mongoose_1.default.Schema.Types.Mixed], default: [] }
    }
}, { strict: false });
var ReportSchema = new mongoose_1.default.Schema({
// Add fields if needed to query from Reports directly
}, { strict: false });
var User = mongoose_1.default.model('User', UserSchema);
var Report = mongoose_1.default.model('Report', ReportSchema);
function migrateStats() {
    return __awaiter(this, void 0, void 0, function () {
        var users, updatedCount, _i, users_1, user, lessons, completedCount, totalCount, _a, lessons_1, lesson, error_1;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 7, 8, 10]);
                    console.log('Connecting to MongoDB...');
                    return [4 /*yield*/, mongoose_1.default.connect(process.env.MONGODB_URI)];
                case 1:
                    _c.sent();
                    console.log('Connected.');
                    console.log('Fetching users...');
                    return [4 /*yield*/, User.find({})];
                case 2:
                    users = _c.sent();
                    console.log("Found ".concat(users.length, " users."));
                    updatedCount = 0;
                    _i = 0, users_1 = users;
                    _c.label = 3;
                case 3:
                    if (!(_i < users_1.length)) return [3 /*break*/, 6];
                    user = users_1[_i];
                    lessons = ((_b = user.progress) === null || _b === void 0 ? void 0 : _b.lessons) || [];
                    completedCount = 0;
                    totalCount = lessons.length;
                    for (_a = 0, lessons_1 = lessons; _a < lessons_1.length; _a++) {
                        lesson = lessons_1[_a];
                        if (lesson.isCompleted) {
                            completedCount++;
                        }
                    }
                    // If total is 0 but completed > 0 (data inconsistency), fix it
                    if (totalCount < completedCount) {
                        totalCount = completedCount;
                    }
                    // Or if total is just missing
                    if (totalCount === 0 && lessons.length > 0) {
                        totalCount = lessons.length;
                    }
                    // Add a default total if they have genuinely 0 history to show a full circle
                    if (totalCount === 0) {
                        totalCount = 10;
                        completedCount = 0;
                        console.log("User ".concat(user._id, " had 0 total courses. Defaulting total to 10 for visual charts."));
                    }
                    user.progress.totalLessons = totalCount;
                    user.progress.completedLessons = Math.min(completedCount, totalCount); // Ensure completed <= total
                    return [4 /*yield*/, user.save()];
                case 4:
                    _c.sent();
                    updatedCount++;
                    _c.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6:
                    console.log("\nMigration completed successfully! Updated ".concat(updatedCount, " users."));
                    return [3 /*break*/, 10];
                case 7:
                    error_1 = _c.sent();
                    console.error('Migration failed:', error_1);
                    return [3 /*break*/, 10];
                case 8: return [4 /*yield*/, mongoose_1.default.disconnect()];
                case 9:
                    _c.sent();
                    console.log('Disconnected from MongoDB.');
                    return [7 /*endfinally*/];
                case 10: return [2 /*return*/];
            }
        });
    });
}
migrateStats();
