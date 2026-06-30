import MapKit

extension ApplePoiCategory {
  static func from(_ category: MKPointOfInterestCategory?) -> (category: ApplePoiCategory, rawCategory: String?) {
    guard let category else {
      return (.unknown, nil)
    }

    if category == .airport { return (.airport, nil) }
    if category == .amusementPark { return (.amusementpark, nil) }
    if category == .aquarium { return (.aquarium, nil) }
    if category == .atm { return (.atm, nil) }
    if category == .bakery { return (.bakery, nil) }
    if category == .bank { return (.bank, nil) }
    if category == .beach { return (.beach, nil) }
    if category == .brewery { return (.brewery, nil) }
    if category == .cafe { return (.cafe, nil) }
    if category == .campground { return (.campground, nil) }
    if category == .carRental { return (.carrental, nil) }
    if category == .evCharger { return (.evcharger, nil) }
    if category == .fireStation { return (.firestation, nil) }
    if category == .fitnessCenter { return (.fitnesscenter, nil) }
    if category == .foodMarket { return (.foodmarket, nil) }
    if category == .gasStation { return (.gasstation, nil) }
    if category == .hospital { return (.hospital, nil) }
    if category == .hotel { return (.hotel, nil) }
    if category == .laundry { return (.laundry, nil) }
    if category == .library { return (.library, nil) }
    if category == .marina { return (.marina, nil) }
    if category == .movieTheater { return (.movietheater, nil) }
    if category == .museum { return (.museum, nil) }
    if category == .nationalPark { return (.nationalpark, nil) }
    if category == .nightlife { return (.nightlife, nil) }
    if category == .park { return (.park, nil) }
    if category == .parking { return (.parking, nil) }
    if category == .pharmacy { return (.pharmacy, nil) }
    if category == .police { return (.police, nil) }
    if category == .postOffice { return (.postoffice, nil) }
    if category == .publicTransport { return (.publictransport, nil) }
    if category == .restaurant { return (.restaurant, nil) }
    if category == .restroom { return (.restroom, nil) }
    if category == .school { return (.school, nil) }
    if category == .stadium { return (.stadium, nil) }
    if category == .store { return (.store, nil) }
    if category == .theater { return (.theater, nil) }
    if category == .university { return (.university, nil) }
    if category == .winery { return (.winery, nil) }
    if category == .zoo { return (.zoo, nil) }

    if #available(iOS 18.0, *) {
      if category == .animalService { return (.animalservice, nil) }
      if category == .automotiveRepair { return (.automotiverepair, nil) }
      if category == .baseball { return (.baseball, nil) }
      if category == .basketball { return (.basketball, nil) }
      if category == .beauty { return (.beauty, nil) }
      if category == .bowling { return (.bowling, nil) }
      if category == .castle { return (.castle, nil) }
      if category == .conventionCenter { return (.conventioncenter, nil) }
      if category == .distillery { return (.distillery, nil) }
      if category == .fairground { return (.fairground, nil) }
      if category == .fishing { return (.fishing, nil) }
      if category == .fortress { return (.fortress, nil) }
      if category == .golf { return (.golf, nil) }
      if category == .goKart { return (.gokart, nil) }
      if category == .hiking { return (.hiking, nil) }
      if category == .kayaking { return (.kayaking, nil) }
      if category == .landmark { return (.landmark, nil) }
      if category == .mailbox { return (.mailbox, nil) }
      if category == .miniGolf { return (.minigolf, nil) }
      if category == .musicVenue { return (.musicvenue, nil) }
      if category == .nationalMonument { return (.nationalmonument, nil) }
      if category == .planetarium { return (.planetarium, nil) }
      if category.rawValue == "MKPOICategoryPlayground" { return (.playground, nil) }
      if category.rawValue == "MKPOICategoryReligiousSite" { return (.religioussite, nil) }
      if category == .rockClimbing { return (.rockclimbing, nil) }
      if category == .rvPark { return (.rvpark, nil) }
      if category == .skatePark { return (.skatepark, nil) }
      if category == .skating { return (.skating, nil) }
      if category == .skiing { return (.skiing, nil) }
      if category == .soccer { return (.soccer, nil) }
      if category == .spa { return (.spa, nil) }
      if category == .surfing { return (.surfing, nil) }
      if category == .swimming { return (.swimming, nil) }
      if category == .tennis { return (.tennis, nil) }
      if category == .volleyball { return (.volleyball, nil) }
    }

    return (.unknown, category.rawValue)
  }
}
