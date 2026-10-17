// One atomic snapshot per owner. A revision prevents silent cross-device overwrite.
export class CloudStore {
  constructor(client, ownerId, revision = 0) {
    this.client = client;
    this.ownerId = ownerId;
    this.revision = revision;
    this.pending = null;
    this.busy = false;
  }

  async save(document) {
    if (this.pending || this.busy) throw new Error('CHAPTER_PENDING');
    this.pending = { document: structuredClone(document), writeId: crypto.randomUUID() };
    return this.retry();
  }

  async retry() {
    if (!this.pending || this.busy) throw new Error('CHAPTER_PENDING');
    this.busy = true;
    try {
      const { data, error } = await this.client.rpc('chapter_save', {
        p_owner_id: this.ownerId,
        p_expected_revision: this.revision,
        p_write_id: this.pending.writeId,
        p_document: this.pending.document,
      });
      if (error) throw error;
      if (!Number.isSafeInteger(data) || data < 1) throw new Error('CHAPTER_INVALID_RESPONSE');
      this.revision = data;
      this.pending = null;
    } finally {
      this.busy = false;
    }
  }
}
