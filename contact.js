/* Galaxy contact-e-mail: vul hier je aparte Galaxy-adres in, bv. 'galaxy.dating.be@gmail.com' */
window.GALAXY_EMAIL='';
document.addEventListener('DOMContentLoaded',()=>{const e=window.GALAXY_EMAIL;document.querySelectorAll('.mail').forEach(a=>{if(e){a.textContent=e;a.href='mailto:'+e+(a.dataset.s?'?subject='+encodeURIComponent(a.dataset.s):'')}else{a.textContent='e-mailadres volgt binnenkort';a.removeAttribute('href')}})});
