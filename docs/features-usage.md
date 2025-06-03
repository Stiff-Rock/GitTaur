## Características y uso

### Visialización del y gestión del historial del repositorio (Pestaña principal)

<br>

<div style="display: flex; gap: 20px; margin-bottom: 20px;">
<img 
src="./img/graph.png" 
alt="Foto de la aplicación" 
style="width: 250px; box-shadow: 5px 5px 25px rgba(0, 0, 0, 0.3); border-radius: 5px;">

<span style="align-self: center; text-align: justify;">
    GitTaur provee un gráfico que representa el historial del repositorio. En el mismo podemos ver los commits, ramas y tags.
    Puedes hacer click derecho en cualquier commit para abrir el menu de acciones sobre ese commit.
</span>
</div>

---

<div style="display: flex; gap: 20px; margin-bottom: 20px;">
    <span style="align-self: center; text-align: justify;">
    Muchos de los elementos de la aplicación tienen acciones en el menu contextual. En el caso de un commit puedes encontrar 
    las mas fundamentales como checkout, revert, tag entre otras utilidades.
</span>

<img 
    src="./img/commitContext.png" 
    alt="Foto de la aplicación" 
    style="min-width: 250px; box-shadow: 5px 5px 25px rgba(0, 0, 0, 0.3); border-radius: 5px;">
</div>

---

<div style="display: flex; gap: 20px; margin-bottom: 20px;">
<img 
src="./img/actionsSidePanel.png" 
alt="Foto de la aplicación" 
style="min-width: 250px; height: 251px;  box-shadow: 5px 5px 25px rgba(0, 0, 0, 0.3); border-radius: 5px; align-self: center;">

<div>
<span style="align-self: center; text-align: justify;">
    En el panel izquierdo hay dos secciones principales. 
    En la parte superior tenemos tres botones para navegar entre las diferentes áreas de trabajo:
</span>

<ul>
<li>
<b>History</b>: Visualiza el historial del repositorio.
</li>

<li>
<b>Changes</b>: Gestiona cambios en curso.
</li>

<li>
<b>To-Do</b>: Abre un editor Markdown para listas de tareas.
</li>
</ul>

<span style="align-self: center; text-align: justify;">
Debajo hay tres menús desplegables: 
<b>Local</b>: Muestra ramas locales; 
<b>Remotes</b>: Remotos asociados con ramas desplegables; 
<b>Tags</b>: Etiquetas del repositorio. 
Cada elemento tiene un menú contextual para realizar operaciones. Este panel es fijo entre áreas de trabajo.
</span>
</div>
</div>

---

<div style="display: flex; gap: 20px; margin-bottom: 20px;">
<span style="align-self: center; text-align: justify;">
    Cualquier commit que selecciones en el gráfico mostrará su información específica de manera estructurada y fácil de leer.
    Adicionalmente en la parte inferior se podrá ver que cambios fueron efectuados en ese commit.
</span>

<img 
src="./img/infoSidebar.png" 
alt="Foto de la aplicación" 
style="min-width: 250px; box-shadow: 5px 5px 25px rgba(0, 0, 0, 0.3); border-radius: 5px;">
</div>

---

<div style="margin-bottom: 20px;">
 <img 
src="./img/topBar.png" 
alt="Foto de la aplicación" 
style="min-width: 250px; box-shadow: 5px 5px 25px rgba(0, 0, 0, 0.3); border-radius: 5px;">

En la parte superior encontramos los siguientes elementos empezando por la barra en la parte más superior de la aplicación:

- Botón de configuración: Abre una nueva pestaña para ajustar las preferencias relacionadas con la aplicación o con Git.
- Pestañas abiertas: Se muestran todas las pestañas abiertas ya sean repositorios, la pantalla de bienvenida o la configuración.
- Botones de control de la ventana: Controles básicos para gestionar la ventana (minimizar, maximizar, cerrar).

Debajo se sitúa la barra de acciones, la cual contiene diferentes botones que cambian en funcion de la pestaña en la que se encuentre
el usuario. 
<br>
<br>
Podemos encontrar acciones globales como:

<ul style="display: flex; flex-direction: column; gap: 10px;">
<li>
    <img style="margin-bottom: -5px; margin-right: 5px;" src="./img/fileDirectorySymlink.svg" alt="Icono"> 
    Abre el repositorio en el explorador de archivos
</li>

<li>
    <img style="margin-bottom: -5px; margin-right: 5px;" src="./img/terminal.svg" alt="Icono"> 
    Abre la terminal en el directorio del repositorio
</li>
</ul>

O acciones de Git:
<ul style="display: flex; flex-direction: column; gap: 10px;">
<li>
    <img style="margin-bottom: -5px; margin-right: 5px;" src="./img/download.svg" alt="Icono"> 
    Efectua un fetch al remoto que se indique en el pop-up que aparecerá
</li>

<li>
    <img style="margin-bottom: -5px; margin-right: 5px;" src="./img/moveToBottom.svg" alt="Icono"> 
    Aplicla los nuevos cambios del remoto seleccionado al repositorio local si los hubiera
</li>
<li>
    <img style="margin-bottom: -5px; margin-right: 5px;" src="./img/moveToTop.svg" alt="Icono"> 
    Sube los cambios del repositorio local al repositorio remoto seleccionado
</li>

<li>
    <img style="margin-bottom: -5px; margin-right: 5px;" src="./img/gitBranch.svg" alt="Icono"> 
    Permite crear una rama a partir del commit en el que se encuentre el repositorio
</li>
</ul>

Entre otros...

</div>

---

## Administración de los cambios en curso

En el área de trabajo de "Changes" podremos ver, confirmar o descartar cambios que se hayan realizado en el proyecto desde el último commit
o gestionar los stash creados.

---

<div style="display: flex; gap: 20px; margin-bottom: 20px;">
<img 
src="./img/statusArea.png" 
alt="Foto de la aplicación" 
style="min-width: 250px; box-shadow: 5px 5px 25px rgba(0, 0, 0, 0.3); border-radius: 5px;">

<span style="align-self: center; text-align: justify;">
textooooootextooooootextooooootextooooootextoooooo
textooooootextooooootextooooootextooooootextoooooo
</span>
</div>

<div style="display: flex; gap: 20px; margin-bottom: 20px;">
<span style="align-self: center; text-align: justify;">
textooooootextooooootextooooootextooooootextoooooo
textooooootextooooootextooooootextooooootextoooooo
</span>

<img 
    src="./img/commitArea.png" 
    alt="Foto de la aplicación" 
    style="min-width: 250px; box-shadow: 5px 5px 25px rgba(0, 0, 0, 0.3); border-radius: 5px;">
</div>

---

<div style="display: flex; gap: 20px; margin-bottom: 20px;">
<img 
src="./img/stashesArea.png" 
alt="Foto de la aplicación" 
style="min-width: 250px; box-shadow: 5px 5px 25px rgba(0, 0, 0, 0.3); border-radius: 5px;">

<span style="align-self: center; text-align: justify;">
textooooootextooooootextooooootextooooootextoooooo
textooooootextooooootextooooootextooooootextoooooo
</span>
</div>

---

## Creación listas de tareas del proyecto

<div style="display: flex; gap: 20px; margin-bottom: 20px;">
<span style="align-self: center; text-align: justify;">
textooooootextooooootextooooootextooooootextoooooo
textooooootextooooootextooooootextooooootextoooooo
</span>

<img 
src="./img/todoEdit.png" 
alt="Foto de la aplicación" 
style="min-width: 250px; box-shadow: 5px 5px 25px rgba(0, 0, 0, 0.3); border-radius: 5px;">
</div>

<div style="display: flex; gap: 20px; margin-bottom: 20px;">
<img 
src="./img/todoView.png" 
alt="Foto de la aplicación" 
style="min-width: 250px; box-shadow: 5px 5px 25px rgba(0, 0, 0, 0.3); border-radius: 5px;">

<span style="align-self: center; text-align: justify;">
textooooootextooooootextooooootextooooootextoooooo
textooooootextooooootextooooootextooooootextoooooo
</span>
</div>
