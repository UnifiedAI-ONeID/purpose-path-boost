import { initPwa } from '@/lib/pwa/init';

describe('PWA Initialization', () => {
  let addEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: jest.fn().mockResolvedValue({ scope: '/' }),
      },
      writable: true
    });

    // Spy on window.addEventListener
    addEventListenerSpy = jest.spyOn(window, 'addEventListener');
  });

  afterEach(() => {
    // Restore mocks
    addEventListenerSpy.mockRestore();
  });

  test('should register service worker on load', () => {
    initPwa();
    // Simulate the load event
    window.dispatchEvent(new Event('load'));

    expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
  });

  test('should add online and offline event listeners', () => {
    initPwa();

    // Check if both online and offline listeners are added
    const onlineListener = addEventListenerSpy.mock.calls.find(call => call[0] === 'online');
    const offlineListener = addEventListenerSpy.mock.calls.find(call => call[0] === 'offline');

    expect(onlineListener).toBeDefined();
    expect(offlineListener).toBeDefined();
  });
});
