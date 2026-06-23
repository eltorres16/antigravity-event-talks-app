# BigQuery Release Notes Dashboard ⚡

Una aplicación web moderna, responsiva y con una estética visual premium desarrollada con **Python Flask** en el servidor y **HTML, CSS y JavaScript** puro en el cliente. Su propósito es consumir las notas de lanzamiento de BigQuery de Google Cloud, organizarlas cronológicamente de forma clara y permitirte twittear fácilmente sobre cualquier actualización individual.

---

## 🚀 Características Principales

*   **Lector de Feeds Atom:** Descarga e interpreta en tiempo real el XML oficial de las notas de lanzamiento de BigQuery.
*   **Timeline Inteligente:** Desglosa los documentos masivos de notas por fechas y clasifica cada actualización individual en tarjetas con colores según su categoría:
    *   🟢 **Features (Características)**
    *   🔵 **Changes (Cambios)**
    *   🟣 **Fixes (Correcciones)**
    *   🟡 **Deprecated (Depreciaciones)**
    *   🔴 **Security (Seguridad)**
*   **Filtros Rápidos y Buscador:** Filtra notas por su categoría con un clic y busca por palabras clave en tiempo real.
*   **Tweet Composer:** Selecciona una tarjeta y genera automáticamente una plantilla formateada para Twitter/X con límite estricto de 280 caracteres, que luego puedes publicar mediante la integración oficial de Twitter Web Intent.
*   **Diseño Premium:** Estética oscura estilo espacial con efectos de difuminado y transparencias (*glassmorphism*), carga animada (skeletons) y transiciones fluidas.

---

## 🛠️ Requisitos Previos

*   **Python** (versión 3.12 o superior)
*   **uv** (gestor de paquetes de Python ultra rápido instalado en tu sistema)

---

## 📦 Instalación y Uso Local

Sigue estos pasos en tu terminal para ejecutar el servidor de desarrollo:

### 1. Preparar el Entorno Virtual e Instalar Dependencias
Usa `uv` para inicializar el entorno e instalar las dependencias necesarias sin modificar el sistema global:

```bash
# Crear el entorno virtual
uv venv

# Instalar los paquetes necesarios
uv pip install flask requests beautifulsoup4
```

### 2. Iniciar el Servidor Flask
Arranca el servidor local de desarrollo:

```bash
# Ejecutar la aplicación
.venv/bin/python3 app.py
```

El servidor se iniciará en `http://localhost:5000`.

### 3. Acceder a la Aplicación
Abre tu navegador de preferencia y visita:
👉 **[http://localhost:5000](http://localhost:5000)**

---

## 📁 Estructura del Proyecto

*   `app.py`: Servidor Flask, enrutamiento y procesamiento del feed XML/HTML de Google Cloud.
*   `templates/`: Plantillas HTML renderizadas por Flask.
    *   `index.html`: Estructura principal del dashboard.
*   `static/`: Archivos estáticos del frontend.
    *   `css/style.css`: Estilos visuales personalizados, animaciones y diseño responsivo.
    *   `js/app.js`: Lógica del cliente, renderizado del timeline, filtros y editor de tweets.
*   `.gitignore`: Exclusiones para evitar subir entornos virtuales o temporales a Git.

---

## 📄 Licencia
Este proyecto es de código abierto y está libre para su uso y modificación.
