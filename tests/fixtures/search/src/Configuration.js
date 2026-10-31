/* Class names of react-search-component's configuration markup */
export default `
<div class="relative">
  <div class="flex">
    <button type="button" class="border-t-2 m-1 mt-0 p-1 focus:outline-none border-indigo-600 border-white">
      <span class="uppercase font-sans text-base pt-2.5 text-gray-700 text-gray-400"></span>
    </button>
  </div>
  <div class="px-2 pb-2.5">
    <input type="text" class="my-4 text-gray-500 border rounded focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent" />
    <p class="text-sm text-gray-700">Showing <span class="font-medium"></span> results</p>
    <div class="overflow-hidden border-b border-gray-200 sm:rounded-lg">
      <table class="min-w-full divide-y divide-gray-200 table-fixed">
        <tbody class="bg-white divide-y divide-gray-200">
          <tr>
            <td class="w-3/4 px-6 py-4 whitespace-nowrap">
              <div class="flex text-sm text-gray-500 divide-x shadow-sm">
                <div class="flex-1 p-1 px-2 text-indigo-600"></div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button type="button" class="text-indigo-600 hover:text-indigo-900 focus:outline-none">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="flex bg-blue-50 rounded-lg p-5 text-base text-blue-600 place-items-center font-light"></div>
  </div>
</div>
`;
