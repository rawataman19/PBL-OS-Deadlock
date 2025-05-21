document.addEventListener('DOMContentLoaded', ()=>
{ 
    let stage = document.querySelector('#stage')
    for(let i = 0; i < 5;i++)
    {
        let process = document.createElement('div')
        process.className = "process"
        process.id = "P" + i
        process.innerHTML = `<span style="color:white;">P${i}</span>`
        process.style.animationPlayState = "paused"
        stage.appendChild(process)
    }

    let atCriticalSection = false
    let mutex = 1
    let slist = document.querySelector('#slist')
    let lst = document.querySelectorAll('.process')
    let prop = {}
    document.querySelector('#val').innerHTML = mutex

    let li = document.createElement('li')
    li.innerHTML = `Number of processes: 5`
    slist.appendChild(li)

    document.querySelector('#strbtn').addEventListener('click',()=>
    {
        document.querySelectorAll('.process').forEach((e)=>
        {
            e.style.animationPlayState = "running"
            e.addEventListener('webkitAnimationEnd', ()=>
            {
                document.querySelector('#val').innerHTML = 1
                let li = document.createElement('li')
                li.innerHTML = `Process ${e.id} -> Completed`
                slist.appendChild(li)
                setTimeout(()=>
                { 
                    mutex = 1 
                }, 1000)
                document.querySelector('#critical').style.backgroundColor = "rgb(39, 46, 46)"
            })
            
            setTimeout(()=>
            {
                e.style.animationPlayState = "paused"
                atCriticalSection = true
            }, 3000)

            let a = setInterval(()=>
            {
                if(atCriticalSection && (mutex == 1 | mutex == 0) )
                {
                    e.style.animationPlayState = "running"
                    mutex = mutex - 1
                    if (mutex > 0) 
                    {
                        document.querySelector('#val').innerHTML = 1
                    }
                    else 
                    {
                        document.querySelector('#val').innerHTML = 0
                    }
                    
                    document.querySelector('#critical').style.backgroundColor = "red"
                    let li = document.createElement('li')
                    li.innerHTML = `Process ${e.id} -> Critical State`
                    slist.appendChild(li)
                    clearInterval(a)
                }
            }, 100)
        })             
    })
})

