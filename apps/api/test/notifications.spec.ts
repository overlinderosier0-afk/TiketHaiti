import { NotificationService } from '../src/notifications/notifications.module';

// Capture les appels à Resend sans rien envoyer réellement.
// (préfixe `mock` obligatoire : la fabrique jest.mock est hissée.)
const mockSent: any[] = [];
let mockShouldFail = false;
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn(async (args: any) => {
        if (mockShouldFail) throw new Error('resend down');
        mockSent.push(args);
        return { data: { id: 'mock-id' } };
      })
    }
  }))
}));

describe('NotificationService — bienvenue et alerte de connexion', () => {
  const OLD_KEY = process.env.RESEND_API_KEY;

  beforeAll(() => {
    process.env.RESEND_API_KEY = 're_test_key';
  });

  afterAll(() => {
    process.env.RESEND_API_KEY = OLD_KEY;
  });

  beforeEach(() => {
    mockSent.length = 0;
    mockShouldFail = false;
  });

  it('envoie un email de bienvenue après inscription', async () => {
    const svc = new NotificationService();
    await svc.notifyWelcome('nouveau@example.com', { customerName: 'Jean Paul' });

    expect(mockSent).toHaveLength(1);
    expect(mockSent[0].to).toBe('nouveau@example.com');
    expect(mockSent[0].subject).toContain('Byenveni');
    expect(mockSent[0].html).toContain('Jean Paul');
    expect(mockSent[0].html).toContain('tikeayiti.com/events');
  });

  it('envoie une alerte de sécurité à chaque connexion', async () => {
    const svc = new NotificationService();
    await svc.notifyNewLogin('client@example.com', {
      customerName: 'Marie',
      at: new Date('2026-09-30T12:00:00Z')
    });

    expect(mockSent).toHaveLength(1);
    expect(mockSent[0].to).toBe('client@example.com');
    expect(mockSent[0].subject).toContain('koneksyon');
    expect(mockSent[0].html).toContain('Marie');
    expect(mockSent[0].html).toContain('chanje modpas');
  });

  it("n'envoie rien sans clé API (mode dégradé propre)", async () => {
    delete process.env.RESEND_API_KEY;
    try {
      const svc = new NotificationService();
      await svc.notifyWelcome('x@example.com', { customerName: 'X' });
      await svc.notifyNewLogin('x@example.com', { customerName: 'X', at: new Date() });
      expect(mockSent).toHaveLength(0);
    } finally {
      process.env.RESEND_API_KEY = 're_test_key';
    }
  });

  it("ne lève jamais même si Resend échoue", async () => {
    mockShouldFail = true;
    const svc = new NotificationService();
    await expect(
      svc.notifyWelcome('x@example.com', { customerName: 'X' })
    ).resolves.toBeUndefined();
    await expect(
      svc.notifyNewLogin('x@example.com', { customerName: 'X', at: new Date() })
    ).resolves.toBeUndefined();
  });
});
