import {useRuntimeProductState} from '../runtime/productState'
import {planetModeReturn} from '../planet/planetContracts'
import {solarExit} from '../solar/solarNavigation'

/** Return intent cannot depend on successful source download or GPU startup. */
export function terrainNativeExit(returned:unknown,mode:'earth'|'sky',epoch:string,search:string,mobile:boolean){
 useRuntimeProductState.getState().ingestSearch(search)
 const destination=planetModeReturn(returned,mode,epoch),product=useRuntimeProductState.getState()
 return solarExit(destination.path,epoch,destination.state,product.views,product.selection,mobile,product.observer)
}
