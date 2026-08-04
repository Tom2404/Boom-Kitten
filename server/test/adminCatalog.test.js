const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createCatalogItem,
  deleteCatalogItem,
  updateCatalogItem,
} = require('../services/admin/catalogService');

const actor = { id: 'admin-1', username: 'operator-cat', role: 'operator' };
const request = { requestId: 'transport-1', ip: '127.0.0.1', userAgent: 'Admin Browser' };

test('creates a catalog item and writes the normalized audit record', async () => {
  const created = { _id: 'item-1', name: 'Red Frame', type: 'avatar_frame', __v: 0, toObject() { return { _id: this._id, name: this.name, type: this.type, __v: this.__v }; } };
  const CatalogModel = { create: async () => created };
  let auditInput;

  const result = await createCatalogItem({
    CatalogModel,
    audit: async (input) => { auditInput = input; },
    actor,
    input: { name: 'Red Frame', type: 'avatar_frame' },
    mutation: { requestId: 'catalog-create-1', reason: '' },
    request,
  });

  assert.equal(result, created);
  assert.equal(auditInput.action, 'CATALOG_ITEM_CREATED');
  assert.equal(auditInput.target.id, 'item-1');
  assert.equal(auditInput.request.operationRequestId, 'catalog-create-1');
});

test('normalizes asset framing before creating a catalog item', async () => {
  let persisted;
  const created = { _id: 'item-transform', name: 'Framed Field', type: 'field', __v: 0 };

  await createCatalogItem({
    CatalogModel: { create: async (payload) => { persisted = payload; return created; } },
    audit: async () => {},
    actor,
    input: {
      name: 'Framed Field',
      type: 'field',
      assetTransform: { scale: '9', x: '-80', y: '12.5' },
    },
    mutation: { requestId: 'catalog-create-transform', reason: '' },
    request,
  });

  assert.deepEqual(persisted.assetTransform, { scale: 3, x: -50, y: 12.5 });
});

test('rejects unsafe catalog asset URLs before writing', async () => {
  await assert.rejects(
    createCatalogItem({
      CatalogModel: { create: async () => assert.fail('unsafe item must not be created') },
      audit: async () => {},
      actor,
      input: {
        name: 'Unsafe Field',
        type: 'field',
        imageUrl: 'javascript:alert(1)',
        previewUrl: 'data:image/svg+xml;base64,abc',
      },
      mutation: { requestId: 'catalog-create-unsafe', reason: '' },
      request,
    }),
    (error) => error.code === 'VALIDATION_ERROR' && error.statusCode === 422,
  );
});

test('uses optimistic versioning when updating a catalog item', async () => {
  let updateFilter;
  const before = { _id: 'item-1', name: 'Old', type: 'skin', __v: 4, toObject() { return { _id: this._id, name: this.name, type: this.type, __v: this.__v }; } };
  const after = { _id: 'item-1', name: 'New', type: 'skin', __v: 5, toObject() { return { _id: this._id, name: this.name, type: this.type, __v: this.__v }; } };
  const CatalogModel = {
    findById: async () => before,
    findOneAndUpdate: (filter) => {
      updateFilter = filter;
      return { then: (resolve) => resolve(after) };
    },
  };

  const result = await updateCatalogItem({
    CatalogModel,
    audit: async () => {},
    actor,
    itemId: 'item-1',
    input: { name: 'New', type: 'skin' },
    mutation: { requestId: 'catalog-update-1', reason: '' },
    request,
  });

  assert.equal(result, after);
  assert.deepEqual(updateFilter, { _id: 'item-1', __v: 4 });
});

test('requires a reason and version-safe delete for catalog items', async () => {
  const before = { _id: 'item-1', name: 'Old', type: 'skin', __v: 2, toObject() { return { _id: this._id, name: this.name, type: this.type, __v: this.__v }; } };
  let deleteFilter;
  let auditInput;
  const CatalogModel = {
    findById: async () => before,
    deleteOne: async (filter) => { deleteFilter = filter; return { deletedCount: 1 }; },
  };

  await deleteCatalogItem({
    CatalogModel,
    UserModel: { exists: async () => false },
    audit: async (input) => { auditInput = input; },
    actor,
    itemId: 'item-1',
    mutation: { requestId: 'catalog-delete-1', reason: 'Duplicate item from import' },
    request,
  });

  assert.deepEqual(deleteFilter, { _id: 'item-1', __v: 2 });
  assert.equal(auditInput.action, 'CATALOG_ITEM_DELETED');
  assert.equal(auditInput.reason, 'Duplicate item from import');
});

test('blocks hard delete when an item is owned or equipped', async () => {
  const before = { _id: 'item-1', name: 'Owned Frame', type: 'avatar_frame', __v: 2 };
  let referenceFilter;
  await assert.rejects(
    deleteCatalogItem({
      CatalogModel: {
        findById: async () => before,
        deleteOne: async () => assert.fail('referenced item must not be deleted'),
      },
      UserModel: { exists: async (filter) => {
        referenceFilter = filter;
        return { _id: 'user-1' };
      } },
      audit: async () => assert.fail('blocked delete must not be audited as deleted'),
      actor,
      itemId: 'item-1',
      mutation: { requestId: 'catalog-delete-owned', reason: 'Cleanup' },
      request,
    }),
    (error) => error.code === 'CATALOG_ITEM_IN_USE' && error.statusCode === 409,
  );
  assert.ok(referenceFilter.$or.some((filter) => filter.ownedAvatarFrames === 'Owned Frame'));
  assert.ok(referenceFilter.$or.some((filter) => filter.activeAvatarFrame === 'Owned Frame'));
});
