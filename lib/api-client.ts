import { getAccessTokenRSC } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';

/**
 * Cliente HTTP simple que maneja 401s mostrando modal de sesión expirada
 * El refresh de tokens lo maneja automáticamente el SDK de Logto
 */
class ApiClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Realiza una petición HTTP con manejo de 401
   */
  async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      // Obtener token con el resource del backend para que el JWT tenga aud correcto
      const accessToken = await getAccessTokenRSC(logtoConfig, process.env.LOGTO_API_RESOURCE);
      
      // 2. Preparar headers
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`
      };

      // 3. Realizar petición
      const response = await fetch(url, {
        ...options,
        headers
      });

      // 4. Si es 401, mostrar modal de sesión expirada
      if (response.status === 401) {
        console.warn('[API] Backend devolvió 401 - sesión expirada');
        
        // Mostrar modal de sesión expirada
        if (typeof window !== 'undefined') {
          showSessionExpiredModal();
        }
        
        throw new Error('Session expired - user needs to login again');
      }

      return response;
      
    } catch (error: any) {
      console.error('[API] Error en petición:', {
        endpoint,
        error: error.message
      });
      throw error;
    }
  }

  // Métodos de conveniencia
  async get(endpoint: string, options: RequestInit = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint: string, data?: any, options: RequestInit = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async put(endpoint: string, data?: any, options: RequestInit = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async delete(endpoint: string, options: RequestInit = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

/**
 * Muestra modal de sesión expirada y redirige al login
 */
function showSessionExpiredModal() {
  // Crear modal simple
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    font-family: system-ui, -apple-system, sans-serif;
  `;
  
  modal.innerHTML = `
    <div style="
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      text-align: center;
      max-width: 400px;
      margin: 1rem;
    ">
      <div style="font-size: 3rem; margin-bottom: 1rem;">🔒</div>
      <h2 style="margin: 0 0 1rem 0; color: #333;">Sesión Expirada</h2>
      <p style="margin: 0 0 1.5rem 0; color: #666;">
        Tu sesión ha expirado. Por favor, inicia sesión nuevamente para continuar.
      </p>
      <button id="loginButton" style="
        background: #007f8b;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 600;
      ">
        Iniciar Sesión
      </button>
    </div>
  `;
  
  // Agregar al DOM
  document.body.appendChild(modal);
  
  // Manejar click en botón
  const loginButton = modal.querySelector('#loginButton');
  loginButton?.addEventListener('click', () => {
    window.location.href = '/api/logto/sign-in';
  });
  
  // Cerrar con ESC
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      window.location.href = '/api/iniciar';
    }
  };
  document.addEventListener('keydown', handleEsc);
}

// Instancia singleton
export const apiClient = new ApiClient();

/**
 * Hook para usar en componentes cliente
 */
export function useApiClient() {
  return {
    async request(endpoint: string, options: RequestInit = {}) {
      try {
        const response = await fetch(endpoint, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          }
        });

        if (response.status === 401) {
          console.warn('[CLIENT] API devolvió 401 - mostrando modal');
          showSessionExpiredModal();
          throw new Error('Session expired');
        }

        return response;
      } catch (error) {
        console.error('[CLIENT] Error en API:', error);
        throw error;
      }
    },
    
    get: (endpoint: string, options: RequestInit = {}) => 
      useApiClient().request(endpoint, { ...options, method: 'GET' }),
    
    post: (endpoint: string, data?: any, options: RequestInit = {}) => 
      useApiClient().request(endpoint, { 
        ...options, 
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined 
      }),
    
    put: (endpoint: string, data?: any, options: RequestInit = {}) => 
      useApiClient().request(endpoint, { 
        ...options, 
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined 
      }),
    
    delete: (endpoint: string, options: RequestInit = {}) => 
      useApiClient().request(endpoint, { ...options, method: 'DELETE' })
  };
}

export default apiClient;