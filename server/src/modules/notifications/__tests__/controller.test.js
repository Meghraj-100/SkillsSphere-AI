import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import {
  getNotifications,
  getUnreadCount,
  createNotification,
  getNotification,
  markAsRead,
  markAllAsRead,
  deleteNotificationById,
  deleteAllNotificationsForUser,
} from "../controller.js";
import Notification from "../../../database/models/Notification.js";
import AppError from "../../../utils/AppError.js";

const flush = () => new Promise(r => setTimeout(r, 0));

describe("Notification Controller", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { _id: "user123" },
    };
    res = {
      status: mock.fn(() => res),
      json: mock.fn(),
    };
    next = mock.fn();
  });

  afterEach(() => {
    mock.restoreAll();
  });

  describe("getNotifications", () => {
    it("should respond with 200 and paginated notifications", async () => {
      const mockNotifications = [{ _id: "n1", title: "Test" }];
      mock.method(Notification, "find", () => ({
        sort: () => ({ skip: () => ({ limit: () => ({ populate: () => mockNotifications }) }) }),
      }));
      mock.method(Notification, "countDocuments", () => 1);

      req.query = { page: "1", limit: "20" };
      getNotifications(req, res, next);
      await flush();

      assert.equal(res.status.mock.calls[0].arguments[0], 200);
      assert.equal(res.json.mock.calls[0].arguments[0].success, true);
      assert.deepEqual(
        res.json.mock.calls[0].arguments[0].data,
        mockNotifications,
      );
    });
  });

  describe("getUnreadCount", () => {
    it("should respond with 200 and unread count", async () => {
      mock.method(Notification, "countDocuments", () => 5);

      getUnreadCount(req, res, next);
      await flush();

      assert.equal(res.status.mock.calls[0].arguments[0], 200);
      assert.equal(
        res.json.mock.calls[0].arguments[0].data.unreadCount,
        5,
      );
    });
  });

  describe("createNotification", () => {
    const validBody = () => ({
      userId: "targetUser",
      title: "Test Title",
      message: "Test Message",
      type: "info",
    });

    it("should respond with 201 and created notification", async () => {
      const body = validBody();
      req.body = body;
      const mockCreated = { _id: "n1", ...body };
      mock.method(Notification, "create", () => ({
        populate: () => mockCreated,
      }));

      createNotification(req, res, next);
      await flush();

      assert.equal(res.status.mock.calls[0].arguments[0], 201);
      assert.equal(res.json.mock.calls[0].arguments[0].success, true);
      assert.deepEqual(res.json.mock.calls[0].arguments[0].data, mockCreated);
    });

    it("should throw AppError(400) when userId is missing", async () => {
      req.body = { ...validBody() };
      delete req.body.userId;

      createNotification(req, res, next);
      await flush();

      assert.equal(next.mock.calls.length, 1);
      assert.ok(next.mock.calls[0].arguments[0] instanceof AppError);
      assert.equal(next.mock.calls[0].arguments[0].statusCode, 400);
      assert.ok(next.mock.calls[0].arguments[0].errors.userId);
    });

    it("should throw AppError(400) when title is missing", async () => {
      req.body = { ...validBody() };
      delete req.body.title;

      createNotification(req, res, next);
      await flush();

      assert.equal(next.mock.calls.length, 1);
      assert.ok(next.mock.calls[0].arguments[0] instanceof AppError);
      assert.equal(next.mock.calls[0].arguments[0].statusCode, 400);
      assert.ok(next.mock.calls[0].arguments[0].errors.title);
    });

    it("should throw AppError(400) when message is missing", async () => {
      req.body = { ...validBody() };
      delete req.body.message;

      createNotification(req, res, next);
      await flush();

      assert.equal(next.mock.calls.length, 1);
      assert.ok(next.mock.calls[0].arguments[0] instanceof AppError);
      assert.equal(next.mock.calls[0].arguments[0].statusCode, 400);
      assert.ok(next.mock.calls[0].arguments[0].errors.message);
    });

    it("should throw AppError(400) when type is missing", async () => {
      req.body = { ...validBody() };
      delete req.body.type;

      createNotification(req, res, next);
      await flush();

      assert.equal(next.mock.calls.length, 1);
      assert.ok(next.mock.calls[0].arguments[0] instanceof AppError);
      assert.equal(next.mock.calls[0].arguments[0].statusCode, 400);
      assert.ok(next.mock.calls[0].arguments[0].errors.type);
    });

    it("should throw AppError(400) when type is invalid", async () => {
      req.body = { ...validBody(), type: "invalid-type" };

      createNotification(req, res, next);
      await flush();

      assert.equal(next.mock.calls.length, 1);
      assert.ok(next.mock.calls[0].arguments[0] instanceof AppError);
      assert.equal(next.mock.calls[0].arguments[0].statusCode, 400);
      assert.ok(next.mock.calls[0].arguments[0].errors.type);
    });
  });

  describe("getNotification", () => {
    it("should respond with 200 and the notification", async () => {
      const mockNotification = { _id: "n1", title: "Test", userId: { _id: "user123" } };
      mockNotification.populate = () => mockNotification;
      mock.method(Notification, "findById", () => mockNotification);

      req.params = { id: "n1" };
      getNotification(req, res, next);
      await flush();

      assert.equal(res.status.mock.calls[0].arguments[0], 200);
      assert.equal(res.json.mock.calls[0].arguments[0].success, true);
    });
  });

  describe("markAsRead", () => {
    it("should respond with 200", async () => {
      const notification = {
        _id: "n1",
        userId: "user123",
        isRead: false,
        save: () => {},
        populate: () => notification,
      };
      mock.method(Notification, "findById", () => notification);

      req.params = { id: "n1" };
      markAsRead(req, res, next);
      await flush();

      assert.equal(res.status.mock.calls[0].arguments[0], 200);
      assert.equal(res.json.mock.calls[0].arguments[0].success, true);
      assert.ok(notification.isRead);
    });
  });

  describe("markAllAsRead", () => {
    it("should respond with 200", async () => {
      mock.method(Notification, "updateMany", () => ({}));

      markAllAsRead(req, res, next);
      await flush();

      assert.equal(res.status.mock.calls[0].arguments[0], 200);
      assert.equal(res.json.mock.calls[0].arguments[0].success, true);
    });
  });

  describe("deleteNotificationById", () => {
    it("should respond with 200", async () => {
      const doc = { _id: "n1", userId: "user123" };
      mock.method(Notification, "findById", () => doc);
      mock.method(Notification, "findByIdAndDelete", () => ({}));

      req.params = { id: "n1" };
      deleteNotificationById(req, res, next);
      await flush();

      assert.equal(res.status.mock.calls[0].arguments[0], 200);
      assert.equal(res.json.mock.calls[0].arguments[0].success, true);
    });
  });

  describe("deleteAllNotificationsForUser", () => {
    it("should respond with 200 and deleted count", async () => {
      mock.method(Notification, "deleteMany", () => ({ deletedCount: 3 }));

      deleteAllNotificationsForUser(req, res, next);
      await flush();

      assert.equal(res.status.mock.calls[0].arguments[0], 200);
      assert.equal(res.json.mock.calls[0].arguments[0].success, true);
      assert.equal(
        res.json.mock.calls[0].arguments[0].data.deletedCount,
        3,
      );
    });
  });
});
