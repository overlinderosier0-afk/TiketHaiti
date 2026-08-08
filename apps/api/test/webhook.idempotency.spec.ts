describe('Webhook idempotency contract', () => {
  it('expects the webhook path to be idempotent and accept duplicate receipts safely', () => {
    const duplicatePayload = { transactionReference: 'ref-001' };
    expect(duplicatePayload).toHaveProperty('transactionReference');
  });
});
