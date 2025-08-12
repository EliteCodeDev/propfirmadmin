import { useMemo } from 'react';

/**
 * Hook personalizado para validar arrays y proporcionar valores seguros
 * Evita errores como "array.map is not a function" y proporciona fallbacks
 */
export function useArrayValidation<T>(data: T[] | null | undefined) {
  return useMemo(() => {
    // Validar que data sea un array válido
    const isValidArray = Array.isArray(data) && data.length > 0;
    const safeArray = isValidArray ? data : [];
    
    return {
      // Array validado y seguro para usar
      data: safeArray,
      // Indicadores de estado
      isValid: isValidArray,
      isEmpty: !isValidArray,
      length: safeArray.length,
      // Métodos seguros para operaciones comunes
      safeMap: <U>(callback: (item: T, index: number) => U) => {
        return safeArray.map(callback);
      },
      safeFilter: (callback: (item: T, index: number) => boolean) => {
        return safeArray.filter(callback);
      },
      safeFind: (callback: (item: T, index: number) => boolean) => {
        return safeArray.find(callback);
      },
      safeFindIndex: (callback: (item: T, index: number) => boolean) => {
        return safeArray.findIndex(callback);
      }
    };
  }, [data]);
}

/**
 * Hook para validar objetos y sus propiedades
 * Proporciona acceso seguro a propiedades anidadas
 */
export function useObjectValidation<T extends Record<string, any>>(
  obj: T | null | undefined
) {
  return useMemo(() => {
    const isValid = obj !== null && obj !== undefined && typeof obj === 'object';
    
    return {
      // Objeto validado
      data: isValid ? obj : {} as T,
      // Indicadores de estado
      isValid,
      isEmpty: !isValid,
      // Método seguro para acceder a propiedades
      safeGet: <K extends keyof T>(key: K, fallback?: T[K]) => {
        if (!isValid || !(key in obj)) {
          return fallback;
        }
        return obj[key];
      },
      // Método para verificar si una propiedad existe
      has: <K extends keyof T>(key: K) => {
        return isValid && key in obj;
      }
    };
  }, [obj]);
}

/**
 * Hook combinado para validar arrays de objetos
 * Útil para datos de API que pueden ser arrays de objetos
 */
export function useArrayObjectValidation<T extends Record<string, any>>(
  data: T[] | null | undefined
) {
  const arrayValidation = useArrayValidation(data);
  
  return useMemo(() => ({
    ...arrayValidation,
    // Método seguro para mapear con validación de objetos
    safeMapWithObjectValidation: <U>(
      callback: (item: T, index: number, validation: ReturnType<typeof useObjectValidation<T>>) => U
    ) => {
      return arrayValidation.safeMap((item, index) => {
        const objectValidation = {
          data: item || {} as T,
          isValid: item !== null && item !== undefined && typeof item === 'object',
          isEmpty: !item,
          safeGet: <K extends keyof T>(key: K, fallback?: T[K]) => {
            if (!item || !(key in item)) {
              return fallback;
            }
            return item[key];
          },
          has: <K extends keyof T>(key: K) => {
            return item && key in item;
          }
        };
        return callback(item, index, objectValidation);
      });
    }
  }), [arrayValidation]);
}