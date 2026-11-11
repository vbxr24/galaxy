/* Galaxy contact-e-mail */
window.GALAXY_EMAIL='galaxy.app.xv@gmail.com';
document.addEventListener('DOMContentLoaded',()=>{const e=window.GALAXY_EMAIL;document.querySelectorAll('.mail').forEach(a=>{if(e){a.textContent=e;a.href='mailto:'+e+(a.dataset.s?'?subject='+encodeURIComponent(a.dataset.s):'')}else{a.textContent='e-mailadres volgt binnenkort';a.removeAttribute('href')}})});
